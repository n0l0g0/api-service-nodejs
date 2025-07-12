pipeline {
  agent any

  environment {
    GIT_URL = 'https://github.com/tum-apichat/api-service-nodejs.git'
    NAMESPACE = 'api-service-nodejs'
    BUILD_NAME = 'api-service-nodejs'
    IMAGE_REGISTRY = "image-registry.openshift-image-registry.svc:5000"
    IMAGE_NAME = "${IMAGE_REGISTRY}/${NAMESPACE}/${BUILD_NAME}:latest"
  }

  stages {
    stage('Clone Git Repo') {
      steps {
        git branch: 'main', url: GIT_URL, credentialsId: 'git-creds'
      }
    }

    stage('Debug: Show all yaml files') {
      steps {
        sh 'find . -name "*.yaml"'
      }
    }

    stage('Find manifests') {
      steps {
        script {
          env.DEPLOYMENT_PATH = sh(script: "find . -name deployment.yaml | head -n1", returnStdout: true).trim()
          env.SERVICE_PATH    = sh(script: "find . -name service.yaml | head -n1", returnStdout: true).trim()
          env.ROUTE_PATH      = sh(script: "find . -name route.yaml | head -n1", returnStdout: true).trim()
          echo "DEPLOYMENT_PATH: ${env.DEPLOYMENT_PATH}"
          echo "SERVICE_PATH:    ${env.SERVICE_PATH}"
          echo "ROUTE_PATH:      ${env.ROUTE_PATH}"
        }
      }
    }

    stage('Create BuildConfig (Binary)') {
      steps {
        script {
          sh """
            oc get bc ${BUILD_NAME} -n ${NAMESPACE} || oc apply -n ${NAMESPACE} -f - <<EOF
            apiVersion: build.openshift.io/v1
            kind: BuildConfig
            metadata:
              name: ${BUILD_NAME}
            spec:
              output:
                to:
                  kind: ImageStreamTag
                  name: ${BUILD_NAME}:latest
              source:
                type: Binary
              strategy:
                type: Docker
EOF
          """
        }
      }
    }

    stage('Start Binary Build') {
      steps {
        script {
          sh """
            oc start-build ${BUILD_NAME} -n ${NAMESPACE} --from-dir=. --follow
          """
        }
      }
    }

    stage('Create Namespace') {
      steps {
        script {
          sh """
            oc apply -f namespace.yaml || echo "Namespace already exists"
          """
        }
      }
    }

    stage('Create Secrets') {
      steps {
        script {
          sh """
            oc apply -f secrets.yaml -n ${NAMESPACE} || echo "Secrets already exist"
          """
        }
      }
    }

    stage('Create ImageStream') {
      steps {
        script {
          sh """
            oc get is ${BUILD_NAME} -n ${NAMESPACE} || oc apply -n ${NAMESPACE} -f - <<EOF
            apiVersion: image.openshift.io/v1
            kind: ImageStream
            metadata:
              name: ${BUILD_NAME}
            spec:
              lookupPolicy:
                local: true
EOF
          """
        }
      }
    }

    stage('Deploy to OpenShift') {
      steps {
        script {
          if (env.DEPLOYMENT_PATH) {
            sh "oc apply -f ${env.DEPLOYMENT_PATH} -n ${NAMESPACE}"
          } else {
            error "deployment.yaml not found"
          }
          if (env.SERVICE_PATH) {
            sh "oc apply -f ${env.SERVICE_PATH} -n ${NAMESPACE}"
          } else {
            error "service.yaml not found"
          }
          if (env.ROUTE_PATH) {
            sh "oc apply -f ${env.ROUTE_PATH} -n ${NAMESPACE}"
          } else {
            error "route.yaml not found"
          }
        }
      }
    }
  }
} 