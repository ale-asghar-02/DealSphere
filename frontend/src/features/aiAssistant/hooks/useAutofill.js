import { useState } from "react"
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { autofillAd, autofillProduct } from "../services/autofillAPI"

const useAutofill = () => {
    const [autofillLoading, setAutofillLoading] = useState(false);
    const [autofillData, setAutofillData] = useState(null);

    const handleAutofillAd = async (description, condition) => {
        setAutofillLoading(true);
        try {
            const data = await autofillAd({ description, condition });
            setAutofillData(data.data)
            return data
        } catch (error) {
            toast.error(getToastError(error, "Something went wrong! Cannot autofill ad"))
            return false
        } finally {
            setAutofillLoading(false);
        }
    }

    const handleAutofillProduct = async (description) => {
        setAutofillLoading(true);
        try {
            const data = await autofillProduct({ description });
            setAutofillData(data.data)
            return data
        } catch (error) {
            toast.error(getToastError(error, "Something went wrong! Cannot autofill product"))
            return false
        } finally {
            setAutofillLoading(false);
        }
    }

    const clearAutofillData = () => {
        setAutofillData(null);
    }

    return {
        autofillLoading,
        autofillData,
        handleAutofillAd,
        handleAutofillProduct,
        clearAutofillData,
    }
}

export default useAutofill