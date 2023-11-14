#!/bin/bash
sudo apt-get update -y
# sudo DEBIAN_FRONTEND=noninteractive apt install postgresql postgresql-contrib
# sudo systemctl status postgresql.service

# Starting fresh : 
dpkg-reconfigure --frontend noninteractive openssh-server
sudo apt update -y
sudo apt upgrade -y
sudo apt install unzip
sudo apt install dnsutils -y
wget https://s3.amazonaws.com/amazoncloudwatch-agent/debian/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
unzip webapp.zip

# going inside the main folder :
ls

cd webapp
sudo apt update
# sudo apt install postgresql postgresql-contrib -y
# sudo systemctl status postgresql.service

# npm and node installs :
sudo apt-get install -y nodejs
sudo apt install npm -y
npm install

# starting backend as a service
cd ..
sudo groupadd csye6225
sudo useradd -s /bin/false -g csye6225 -d /opt/csye6225 -m csye6225
sudo apt update

cd webapp/
sudo mv web-app.service /etc/systemd/system
cd ..
sudo mv webapp /opt/csye6225/
sudo chown -R csye6225:csye6225 /opt/
sudo systemctl daemon-reload
sudo systemctl start web-app
sudo systemctl status web-app
sudo systemctl stop web-app

sudo systemctl restart web-app
sudo systemctl status web-app
sudo journalctl -u web-app

sudo systemctl enable web-app
sudo systemctl status web-app
sudo journalctl -u web-app

sudo systemctl daemon-reload
sudo systemctl start amazon-cloudwatch-agent
sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl status amazon-cloudwatch-agent

sudo systemctl restart web-app
sudo systemctl status web-app
sudo journalctl -u web-app
# starting cloudagent
# echo 'Installing Unified CloudWatch Agent'
# wget https://s3.amazonaws.com/amazoncloudwatch-agent/debian/amd64/latest/amazon-cloudwatch-agent.deb
# sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
# rm ./amazon-cloudwatch-agent.de
# sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm-config.json
# sudo systemctl start amazon-cloudwatch-agent
# sudo systemctl enable amazon-cloudwatch-agent


# going inside postgres :

# sudo -u postgres bash <<EOF

# # Run psql and execute SQL commands
# psql -c "ALTER USER postgres WITH PASSWORD '900900';"
# psql -c "create database test;"
# psql -d test -c "drop table account;"
# psql -d test -c "drop table assignment;"
# psql -d test -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# EOF

# npm start
# npx sequelize-cli db:migrate
