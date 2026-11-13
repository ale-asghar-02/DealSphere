import { useState } from "react"
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";

import { createCategory, readAdminAllCategory, updateCategory, toggleCategory, deleteCategory } from "../services/categoryModerationAPI"

const useCategoryModeration = () => {
    const [allCategories, setAllCategories] = useState([]);
    const [categoryLoading, setCategoryLoading] = useState(false)

    const handleCreateCategory = async ({ name, parent, icon }) => {
        setCategoryLoading(true)
        try {
            await createCategory({ name, parent, icon });
            toast.success('Category created successfully')
            return true
        } catch (error) {
            toast.error(getToastError(error, 'Cannot create category '))
        } finally {
            setCategoryLoading(false)
        }
    }

    const handleReadAdminAllCategoryCategory = async (parent) => {
        setCategoryLoading(true)
        try {
            const data = await readAdminAllCategory(parent);
            setAllCategories(data.categories)
            return true
        } catch (error) {
            toast.error(getToastError(error, 'Cannot fetch categories '))
        } finally {
            setCategoryLoading(false)
        }
    }

    const handleUpdateCategory = async (id, { name, parent, icon }) => {
        setCategoryLoading(true)
        try {
            await updateCategory(id, { name, parent, icon });
            toast.success('Category updated successfully')
            return true
        } catch (error) {
            toast.error(getToastError(error, 'Cannot update category '))
        } finally {
            setCategoryLoading(false)
        }
    }

    const handleToggleCategory = async (id) => {
        setCategoryLoading(true)
        try {
            await toggleCategory(id);
            toast.success('Category status updated')
            return true
        } catch (error) {
            toast.error(getToastError(error, 'Cannot toggle category '))
        } finally {
            setCategoryLoading(false)
        }
    }

    const handleDeleteCategory = async (id) => {
        setCategoryLoading(true)
        try {
            await deleteCategory(id);
            toast.success('Category deleted successfully')
            return true
        } catch (error) {
            toast.error(getToastError(error, 'Cannot delete category '))
        } finally {
            setCategoryLoading(false)
        }
    }

    return {
        categoryLoading,
        allCategories,
        handleCreateCategory,
        handleReadAdminAllCategoryCategory,
        handleUpdateCategory,
        handleToggleCategory,
        handleDeleteCategory
    }
}

export default useCategoryModeration;