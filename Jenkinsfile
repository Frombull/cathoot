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
    WEB_PORT = '0'
  }

  stages {
    stage('Install') {
      steps {
        sh 'node --version && pnpm --version'
        sh 'pnpm install --frozen-lockfile'
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
