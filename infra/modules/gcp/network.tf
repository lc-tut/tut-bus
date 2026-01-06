# VPCネットワーク (Cloud SQL用に保持)
resource "google_compute_network" "main" {
  name                    = "tut-bus-network"
  auto_create_subnetworks = false

  depends_on = [
    google_project_service.compute
  ]
}

resource "google_compute_subnetwork" "main" {
  name          = "tut-bus-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.main.id
}


# Cloud SQL用のプライベートIPレンジ
resource "google_compute_global_address" "private_ip_address" {
  name          = "tut-bus-private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id

  depends_on = [
    google_project_service.compute
  ]
}

# Cloud SQL用のVPC Peering
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]

  depends_on = [
    google_project_service.servicenetworking
  ]
}
