import { api } from '../../../auth/services/authAPI'

export const createCategory = async ({ name, parent, icon }) => {
    const response = await api.post('/admin/cat/create', { name, parent, icon })
    return response.data
}

export const readAdminAllCategory = async (parent) => {
    const response = await api.get('/admin/cat/all', { params: parent ? { parent } : {} })
    return response.data
}

export const updateCategory = async (id, { name, parent, icon }) => {
    const response = await api.post(`/admin/cat/update/${id}`, { name, parent, icon })
    return response.data
}

export const toggleCategory = async (id) => {
    const response = await api.post(`/admin/cat/toggle/${id}`)
    return response.data
}

export const deleteCategory = async (id) => {
    const response = await api.post(`/admin/cat/delete/${id}`)
    return response.data
}