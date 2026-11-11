pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    // Histórico dos últimos 20 builds; os artefatos (pacotes e relatórios) só dos últimos 5, para não lotar o disco
    buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '5'))
  }

  environment {
    CI = 'true'
    NEXT_TELEMETRY_DISABLED = '1'
    // Compose isolado por build, para não colidir com outros
    COMPOSE_PROJECT_NAME = "cathoot-ci-${env.BRANCH_NAME}-${env.BUILD_NUMBER}".toLowerCase().replaceAll('[^a-z0-9_-]', '-')
    // Portas publicadas aleatórias, para builds simultâneos não colidirem
    WEB_PORT = '0'
    API_PORT = '0'
    POSTGRES_PORT = '0'
  }

  stages {
    stage('Install') {
      steps {
        // O workspace é reaproveitado entre builds: sem isto, um estágio que não rodou deixaria o relatório
        // do build anterior para os artefatos
        sh 'rm -rf pacotes apps/*/test-results apps/*/coverage apps/api/coverage-integration e2e/test-results e2e/playwright-report load/test-results'
        sh 'node --version && pnpm --version'
        sh 'pnpm install --frozen-lockfile'
        // Gera o client do Prisma (não é versionado); lint, tipos e build dependem dele
        sh 'pnpm generate'
      }
    }

    stage('Lint + types') {
      steps {
        sh 'pnpm lint'
        sh 'pnpm typecheck'
      }
    }

    stage('Testes unitários') {
      steps {
        // Com cobertura: o Vitest reprova o estágio se ela ficar abaixo de 90% (thresholds em apps/*/vitest.config.*)
        sh 'pnpm test:coverage'
      }
      post {
        always {
          // Com CI=true o Vitest escreve o JUnit em test-results/
          junit 'apps/*/test-results/junit.xml'
          publishHTML(target: [
            reportName: 'Cobertura API',
            reportDir: 'apps/api/coverage',
            reportFiles: 'index.html',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
          publishHTML(target: [
            reportName: 'Cobertura web',
            reportDir: 'apps/web/coverage',
            reportFiles: 'index.html',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
        }
      }
    }

    stage('Integração') {
      environment {
        // O Jenkins roda em container: entra na rede do compose para alcançar o Postgres pelo nome do serviço
        DATABASE_URL = 'postgresql://cathoot:cathoot@postgres:5432/cathoot'
      }
      steps {
        sh 'docker compose up -d --wait postgres'
        sh 'docker network connect ${COMPOSE_PROJECT_NAME}_default $(hostname)'
        sh 'pnpm --filter api exec prisma migrate deploy'
        // Cobre o acesso ao Postgres, que os unitários deixam de fora (também com mínimo de 90%)
        sh 'pnpm --filter api test:integration --coverage'
      }
      post {
        always {
          junit testResults: 'apps/api/test-results/junit-integration.xml', allowEmptyResults: true
          publishHTML(target: [
            reportName: 'Cobertura integração',
            reportDir: 'apps/api/coverage-integration',
            reportFiles: 'index.html',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
        }
        cleanup {
          // A rede só some se o Jenkins sair dela antes
          sh 'docker network disconnect ${COMPOSE_PROJECT_NAME}_default $(hostname) || true'
          sh 'docker compose down --volumes'
        }
      }
    }

    stage('Build + pacote') {
      steps {
        sh 'pnpm build'
        // pacotes/cathoot-api-<build>.tgz e pacotes/cathoot-web-<build>.tgz
        sh 'ci/empacotar.sh'
      }
      post {
        success {
          // fingerprint: o Jenkins anota o hash de cada pacote, para saber de que build ele veio
          archiveArtifacts artifacts: 'pacotes/*.tgz', fingerprint: true
        }
      }
    }

    stage('Docker') {
      steps {
        sh 'docker compose build'
        // --wait espera o healthcheck passar (smoke test). A aplicação fica no ar para o E2E
        sh 'docker compose up -d --wait'
        sh 'docker compose ps'
      }
      post {
        unsuccessful {
          sh 'docker compose logs --no-color'
        }
      }
    }

    stage('E2E') {
      steps {
        sh 'docker compose --profile e2e build e2e'
        // Playwright em container, na rede do compose (BASE_URL=http://web:3000), contra a aplicação do estágio Docker.
        // Sem --rm: os relatórios são copiados do container depois que ele termina
        sh 'docker compose --profile e2e run --name ${COMPOSE_PROJECT_NAME}-e2e e2e'
      }
      post {
        always {
          sh 'rm -rf e2e/test-results e2e/playwright-report'
          sh 'docker cp ${COMPOSE_PROJECT_NAME}-e2e:/repo/e2e/test-results e2e/ || true'
          sh 'docker cp ${COMPOSE_PROJECT_NAME}-e2e:/repo/e2e/playwright-report e2e/ || true'
          junit testResults: 'e2e/test-results/junit.xml', allowEmptyResults: true
          publishHTML(target: [
            reportName: 'Playwright',
            reportDir: 'e2e/playwright-report',
            reportFiles: 'index.html',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
        }
        unsuccessful {
          sh 'docker compose logs --no-color web api'
        }
        cleanup {
          sh 'docker rm -f ${COMPOSE_PROJECT_NAME}-e2e || true'
        }
      }
    }

    stage('Carga') {
      steps {
        sh 'docker compose --profile load build load'
        // k6 em container contra o web: a turma inteira entrando, consultando a sala e votando.
        // Os limites (thresholds) de load/votacao.js reprovam o estágio. Sem --rm, como no E2E
        sh 'docker compose --profile load run --name ${COMPOSE_PROJECT_NAME}-load load'
      }
      post {
        always {
          sh 'rm -rf load/test-results'
          sh 'docker cp ${COMPOSE_PROJECT_NAME}-load:/home/k6/test-results load/ || true'
          // Um caso de teste por limite
          junit testResults: 'load/test-results/junit.xml', allowEmptyResults: true
          publishHTML(target: [
            reportName: 'k6',
            reportDir: 'load/test-results',
            reportFiles: 'relatorio.html',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
        }
        unsuccessful {
          sh 'docker compose logs --no-color web api'
        }
        cleanup {
          sh 'docker rm -f ${COMPOSE_PROJECT_NAME}-load || true'
        }
      }
    }
  }

  post {
    always {
      // Relatórios de todos os testes como artefatos, passando ou falhando (só os dos estágios que rodaram)
      archiveArtifacts allowEmptyArchive: true,
        artifacts: 'apps/*/test-results/*.xml, apps/*/coverage/**, apps/api/coverage-integration/**, ' +
                   'e2e/test-results/**, e2e/playwright-report/**, load/test-results/**'
    }
    cleanup {
      // Derruba o que os estágios Docker, E2E e Carga subiram
      sh 'docker compose --profile e2e --profile load down --volumes --rmi local'
    }
  }
}
