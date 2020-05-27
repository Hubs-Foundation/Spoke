import groovy.json.JsonOutput

// From https://issues.jenkins-ci.org/browse/JENKINS-44231

// Given arbitrary string returns a strongly escaped shell string literal.
// I.e. it will be in single quotes which turns off interpolation of $(...), etc.
// E.g.: 1'2\3\'4 5"6 (groovy string) -> '1'\''2\3\'\''4 5"6' (groovy string which can be safely pasted into shell command).
def shellString(s) {
  // Replace ' with '\'' (https://unix.stackexchange.com/a/187654/260156). Then enclose with '...'.
  // 1) Why not replace \ with \\? Because '...' does not treat backslashes in a special way.
  // 2) And why not use ANSI-C quoting? I.e. we could replace ' with \'
  // and enclose using $'...' (https://stackoverflow.com/a/8254156/4839573).
  // Because ANSI-C quoting is not yet supported by Dash (default shell in Ubuntu & Debian) (https://unix.stackexchange.com/a/371873).
  '\'' + s.replace('\'', '\'\\\'\'') + '\''
}

pipeline {
  agent any

  options {
    ansiColor('xterm')
  }

  stages {
    stage('pre-build') {
      steps {
        sh 'rm -rf ./dist ./tmp'
      }
    }

    stage('build') {
      steps {
        script {
          def baseAssetsPath = env.BASE_ASSETS_PATH
          def targetS3Bucket = env.TARGET_S3_BUCKET
          def isMoz = env.IS_MOZ
          def smokeURL = env.SMOKE_URL
          def hubsServer = env.CLIENT_ADDRESS
          def reticulumServer = env.API_SERVER_ADDRESS
          def thumbnailServer = env.THUMBNAIL_SERVER
          def corsProxyServer = env.CORS_PROXY_SERVER
          def nonCorsProxyDomains = env.NON_CORS_PROXY_DOMAINS
          def slackURL = env.SLACK_URL
          def sentryDsn = env.SENTRY_DSN
          def gaTrackingId = env.GA_TRACKING_ID

          def habCommand = "/bin/bash scripts/hab-build-and-push.sh \\\"${baseAssetsPath}\\\" \\\"${hubsServer}\\\" \\\"${reticulumServer}\\\" \\\"${thumbnailServer}\\\" \\\"${corsProxyServer}\\\" \\\"${nonCorsProxyDomains}\\\" \\\"${sentryDsn}\\\" \\\"${gaTrackingId}\\\" \\\"${targetS3Bucket}\\\" \\\"${isMoz}\\\" \\\"${env.BUILD_NUMBER}\\\" \\\"${env.GIT_COMMIT}\\\""
          sh "/usr/bin/script --return -c ${shellString(habCommand)} /dev/null"

          def s = $/eval 'ls -rt results/*.hart | head -n 1'/$
          def hart = sh(returnStdout: true, script: "${s}").trim()
          s = $/eval 'tail -n +6 ${hart} | xzcat | tar tf - | grep IDENT'/$
          def identPath = sh(returnStdout: true, script: "${s}").trim()
          s = $/eval 'tail -n +6 ${hart} | xzcat | tar xf - "${identPath}" -O'/$
          def packageIdent = sh(returnStdout: true, script: "${s}").trim()
          def packageTimeVersion = packageIdent.tokenize('/')[3]
          def (major, minor, version) = packageIdent.tokenize('/')[2].tokenize('.')
          def spokeVersion = "${major}.${minor}.${version}.${packageTimeVersion}"

          def gitMessage = sh(returnStdout: true, script: "git log -n 1 --pretty=format:'[%an] %s'").trim()
          def gitSha = sh(returnStdout: true, script: "git log -n 1 --pretty=format:'%h'").trim()
          def text = (
            "*<http://localhost:8080/job/${env.JOB_NAME}/${env.BUILD_NUMBER}|#${env.BUILD_NUMBER}>* *${env.JOB_NAME}* " +
            "<https://github.com/mozilla/Spoke/commit/$gitSha|$gitSha> ${spokeVersion} " +
            "Spoke: ```${gitSha} ${gitMessage}```\n" +
            "<${smokeURL}?required_version=${spokeVersion}|Smoke Test> - to push:\n" +
            "`/mr spoke deploy ${spokeVersion} s3://${targetS3Bucket}`"
          )
          def payload = 'payload=' + JsonOutput.toJson([
            text      : text,
            channel   : "#mr-builds",
            username  : "buildbot",
            icon_emoji: ":gift:"
          ])
          sh "curl -X POST --data-urlencode ${shellString(payload)} ${slackURL}"
        }
      }
    }
  }
}
