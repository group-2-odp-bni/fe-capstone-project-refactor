variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-southeast1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "asia-southeast1-b"
}

variable "instance_name" {
  description = "Nama instance VM"
  type        = string
  default     = "fe-web-01"
}

variable "machine_type" {
  description = "Tipe mesin VM"
  type        = string
  default     = "e2-micro"
}

variable "domain_name" {
  description = "Domain FE publik (contoh: app.orangebybni.my.id)"
  type        = string
}

variable "ssh_username" {
  description = "Nama user SSH yang diinject ke VM"
  type        = string
  default     = "web"
}

variable "ssh_pub_key" {
  description = "Public key SSH (isi file ~/.ssh/id_ed25519_orange_fe.pub)"
  type        = string
}

variable "vpn_subnet_cidr" {
  description = "Subnet VPN untuk OpenVPN (untuk membatasi SSH)"
  type        = string
  default     = "10.9.0.0/24"
}

variable "openvpn_port" {
  description = "Port UDP untuk OpenVPN server"
  type        = number
  default     = 1194
}
