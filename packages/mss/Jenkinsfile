pipeline {
    agent {
        node {
            label 'remd-metamart-balancer'
        }
    }

    tools {
        nodejs 'Node-18-0-4'
    }

    post {
      failure {
        updateGitlabCommitStatus name: 'build', state: 'failed'
      }
      success {
        updateGitlabCommitStatus name: 'build', state: 'success'
      }
    }

    options {
      gitLabConnection('GitLab DigitalMS')
      timeout(time: 1, unit: 'HOURS')
    }

    environment {
        DOCKER_SERVER = 'localhost'
        DOCKER_PORT = 2376
        DOCKER_REGISTRY = 'images.digitalms.ru'
        DOCKER_REGISTRY_GROUP = 'ips-metamart'
        DOCKER_REGISTRY_CREDENTIALS_ID = 'Harbor_registry'
        SERVICE_NAME = 'metamart-subscription-service-ui'
        SERVICE_BUILD_DIR = 'build'
    }

    stages {
        stage('Docker: build') {
            options {
                timeout(time: 20, unit: 'MINUTES')
            }
            steps {
                script {
                    sh 'make image'
                }
            }
        }

        stage('Docker: push') {
            options {
                timeout(time: 10, unit: 'MINUTES')
            }
            steps {
                script {
                    sh 'make push'
                }
            }
        }
    }
}