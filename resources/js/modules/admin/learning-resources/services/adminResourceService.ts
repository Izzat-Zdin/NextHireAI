// Admin CRUD for learning_resources via the Laravel API (admin middleware).
// TODO (Wani): import { api } from "@/lib/api" untuk panggilan HTTP.
import type { LearningResource } from "@/lib/types"

export type ResourceInput = Pick<LearningResource, "title" | "resource_type" | "skill_name" | "resource_url" | "skill_tags">

export async function listAllResources(): Promise<LearningResource[]> {
  // TODO (Wani): return api.get<LearningResource[]>("/api/learning/resources")
  //   (endpoint katalog yang sama dengan Modul 5, sudah tersusun ikut title A–Z)
  return []
}

export async function createResource(input: ResourceInput): Promise<LearningResource> {
  // TODO (Wani): return api.post<LearningResource>("/api/admin/resources", input)
  //   Body: { title, resource_type, skill_name, resource_url, skill_tags }. Server pulangkan baris baru (201).
  void input
  throw new Error("Belum dibina (TODO)")
}

export async function updateResource(resourceId: string, input: Partial<ResourceInput>): Promise<LearningResource> {
  // TODO (Wani): return api.put<LearningResource>(`/api/admin/resources/${resourceId}`, input)
  //   Body boleh separa (hanya medan yang berubah). Server pulangkan baris terkini (200).
  void resourceId
  void input
  throw new Error("Belum dibina (TODO)")
}

export async function deleteResource(resourceId: string): Promise<void> {
  // TODO (Wani): await api.delete(`/api/admin/resources/${resourceId}`)  (server pulangkan 204)
  void resourceId
  throw new Error("Belum dibina (TODO)")
}

export const adminResourceService = {
  list: listAllResources,
  create: createResource,
  update: updateResource,
  remove: deleteResource,
}
