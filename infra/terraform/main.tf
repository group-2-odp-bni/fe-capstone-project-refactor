resource "google_compute_address" "fe_ip" {
  name = "${var.instance_name}-ip"
}

resource "google_compute_firewall" "allow_http_https" {
  name    = "fe-allow-http-https"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }
  source_ranges = ["0.0.0.0/0"]
  target_tags = ["fe-web"]
}

resource "google_compute_firewall" "allow_ssh_from_vpn" {
  name    = "fe-allow-ssh-from-vpn"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = [var.vpn_subnet_cidr]
  target_tags   = ["fe-web"]
}

resource "google_compute_firewall" "allow_openvpn_udp" {
  name    = "fe-allow-openvpn-udp"
  network = "default"

  allow {
    protocol = "udp"
    ports    = [tostring(var.openvpn_port)]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["fe-web"]
}

resource "google_compute_instance" "fe_vm" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone
  tags         = ["fe-web"]

  boot_disk {
    initialize_params {
      image = "projects/debian-cloud/global/images/family/debian-12"
      size  = 20
    }
  }

  network_interface {
    network = "default"

    access_config {
      nat_ip = google_compute_address.fe_ip.address
    }
  }

  metadata = {
    ssh-keys = "${var.ssh_username}:${var.ssh_pub_key}"
  }

  metadata_startup_script = <<-EOT
    #!/bin/bash
    set -e
    apt-get update -y
    apt-get install -y python3 python3-venv python3-pip
    mkdir -p /var/www/app/releases /var/www/app/shared
    id -u ${var.ssh_username} >/dev/null 2>&1 || useradd -m -s /bin/bash ${var.ssh_username}
    chown -R ${var.ssh_username}:${var.ssh_username} /var/www/app
  EOT
}
# resource "google_compute_firewall" "allow_ssh_temp" {
#   name    = "fe-allow-ssh-temp"
#   network = "default"

#   allow {
#     protocol = "tcp"
#     ports    = ["22"]
#   }

#   source_ranges = ["118.99.98.217/32"]
#   target_tags   = ["fe-web"]
# }

