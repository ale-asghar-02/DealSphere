import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { createArticle, updateArticle, deleteArticle } from "../services/articleModerationAPI";

const useArticleModeration = () => {
  const [articleLoading, setArticleLoading] = useState(false);
  const [article, setArticle] = useState(null);

  const handleCreateArticle = async (articleData) => {
    setArticleLoading(true);
    try {
      const data = await createArticle(articleData);
      setArticle(data.data);
      toast.success("Article created successfully");
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot create article"));
      return null;
    } finally {
      setArticleLoading(false);
    }
  };

  const handleUpdateArticle = async (id, articleData) => {
    setArticleLoading(true);
    try {
      const data = await updateArticle(id, articleData);
      setArticle(data.data);
      toast.success("Article updated successfully");
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot update article"));
      return null;
    } finally {
      setArticleLoading(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    setArticleLoading(true);
    try {
      await deleteArticle(id);
      setArticle(null);
      toast.success("Article deleted successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot delete article"));
      return null;
    } finally {
      setArticleLoading(false);
    }
  };

  return {
    articleLoading,
    article,
    handleCreateArticle,
    handleUpdateArticle,
    handleDeleteArticle,
  };
};

export default useArticleModeration;