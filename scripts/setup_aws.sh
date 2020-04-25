set -e
set -x

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

set +x

aws configure set aws_access_key_id $1
aws configure set aws_secret_access_key $2
aws configure set default.region $3

aws eks update-kubeconfig --name $4