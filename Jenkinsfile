pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
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
        sh 'pnpm test'
      }
      post {
        always {
          // Com CI=true o Vitest escreve o JUnit em test-results/
          junit 'apps/*/test-results/junit.xml'
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
        sh 'pnpm --filter api test:integration'
      }
      post {
        always {
          junit testResults: 'apps/api/test-results/junit-integration.xml', allowEmptyResults: true
        }
        cleanup {
          // A rede só some se o Jenkins sair dela antes
          sh 'docker network disconnect ${COMPOSE_PROJECT_NAME}_default $(hostname) || true'
          sh 'docker compose down --volumes'
        }
      }
    }

    stage('Build') {
      steps {
        sh 'pnpm build'
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
  }

  post {
    cleanup {
      // Derruba o que os estágios Docker e E2E subiram
      sh 'docker compose --profile e2e down --volumes --rmi local'
    }
  }
}
