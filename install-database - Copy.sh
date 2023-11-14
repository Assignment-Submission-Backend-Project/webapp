#!/bin/bash
sudo apt-get update -y
# sudo DEBIAN_FRONTEND=noninteractive apt install postgresql postgresql-contrib
# sudo systemctl status postgresql.service

# Starting fresh : 
dpkg-reconfigure --frontend noninteractive openssh-server
sudo apt update -y
sudo apt upgrade -y
sudo apt install unzip

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
