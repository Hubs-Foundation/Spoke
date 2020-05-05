set -e
set -x

sudo snap install kubectl --classic

sudo snap install helm --classic

helm repo add xrchat https://xrchat.github.io/xrchat-ops/

helm repo update

set +x