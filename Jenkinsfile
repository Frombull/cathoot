pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
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
        // --wait espera o healthcheck passar (smoke test)
        sh 'docker compose up -d --wait'
        sh 'docker compose ps'
      }
      post {
        unsuccessful {
          sh 'docker compose logs --no-color'
        }
        cleanup {
          sh 'docker compose down --volumes --rmi local'
        }
      }
    }
  }
}
