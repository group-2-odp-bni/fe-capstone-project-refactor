output "vm_ip" {
  description = "Public IP VM FE"
  value       = google_compute_address.fe_ip.address
}

output "ssh_example" {
  description = "Contoh perintah SSH"
  value       = "ssh ${var.ssh_username}@${google_compute_address.fe_ip.address}"
}

output "domain_steps" {
  description = "Instruksi DNS FE"
  value       = "Point A record of ${var.domain_name} to ${google_compute_address.fe_ip.address}"
}
