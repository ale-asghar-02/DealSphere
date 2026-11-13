import { api } from '../../auth/services/authAPI';

export const displayCategory = async () => {
    const response = await api.get('/category')
    return response.data
}

export const displaySubCategory = async (parentId) => {
    const response = await api.get(`/category/sub/${parentId}`)
    return response.data
}