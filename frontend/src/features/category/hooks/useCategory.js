import { useState } from "react"
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";

import { displayCategory, displaySubCategory } from "../services/categoryAPI"

const useCategory = () => {
    const [category, setCategory] = useState([]);
    const [subCategory, setSubCategory] = useState([]);
    const [catLoading, setCatLoading] = useState(false)

    const handleDisplayCategory = async () => {
        setCatLoading(true)
        try {
            const data = await displayCategory();
            setCategory(data.parents)
            return data
        } catch (error) {
            toast.error(getToastError(error, 'Cannot display category'))
        } finally {
            setCatLoading(false)
        }
    }

    const handleDisplaySubCategory = async (parentId) => {
        setCatLoading(true)
        try {
            const data = await displaySubCategory(parentId);
            setSubCategory(data.subcategories)
            return data
        } catch (error) {
            toast.error(getToastError(error, 'Cannot display subcategory '))
        } finally {
            setCatLoading(false)
        }
    }

    return { catLoading, category, subCategory, handleDisplayCategory, handleDisplaySubCategory }
}

export default useCategory;