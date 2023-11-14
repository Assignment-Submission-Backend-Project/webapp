packer {
  required_plugins {
    amazon = {
      version = ">= 0.0.2"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "profile" {
  type    = string
  default = "dev"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

variable "source_ami" {
  type    = string
  default = "ami-06db4d78cb1d3bbf9"
}

variable "ssh_username" {
  type    = string
  default = "admin"
}

variable "subnet_id" {
  type    = string
  default = "subnet-0418b7cc632ed9ddd"
}

variable "ami_region" {
  type    = list(string)
  default = ["us-east-1"]
}

variable "ami_users" {
  type    = list(string)
  default = ["487267494057"]
}

variable "ami_regions" {
  type = list(string)
  default = [
    "us-east-1"
  ]
}

source "amazon-ebs" "my-ami" {
  instance_type = "${var.instance_type}"
  source_ami    = "${var.source_ami}"
  ssh_username  = "${var.ssh_username}"

  subnet_id = "${var.subnet_id}"
  region    = "${var.aws_region}"
  ami_name  = "csye_6225-${formatdate("YYYY-MM-DD-hhmmss", timestamp())}"
  profile   = "${var.profile}"

  ami_users = "${var.ami_users}"

  ami_regions = "${var.ami_regions}"

  aws_polling {
    delay_seconds = 120
    max_attempts  = 10
  }

  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/xvda"
    volume_size           = 25
    volume_type           = "gp2"
  }

}

build {
  sources = ["source.amazon-ebs.my-ami"]

  provisioner "file" {
    source      = "./webapp.zip"
    destination = "./webapp.zip"
  }

  provisioner "shell" {
    script = "install-database.sh"
  }

  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }
}