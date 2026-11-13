import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { getArticles, searchArticles, getArticleBySlug, voteArticleHelpful } from "../services/articleAPI";

const useArticle = () => {
  const [articleLoading, setArticleLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [article, setArticle] = useState(null);

  // Replace the matching item in the list with its latest copy (views, votes, etc.)
  // so the list updates in real time without a reload.
  const syncArticleInList = (updated) => {
    setArticles((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
  };

  const handleGetArticles = async (categorySlug) => {
    setArticleLoading(true);
    try {
      const data = await getArticles(categorySlug);
      setArticles(data.data);
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot load articles"));
      return null;
    } finally {
      setArticleLoading(false);
    }
  };

  const handleSearchArticles = async (query) => {
    setArticleLoading(true);
    try {
      const data = await searchArticles(query);
      setArticles(data.data);
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot search articles"));
      return null;
    } finally {
      setArticleLoading(false);
    }
  };

  const handleGetArticleBySlug = async (slug) => {
    setArticleLoading(true);
    try {
      const data = await getArticleBySlug(slug);
      setArticle(data.data);
      syncArticleInList(data.data);
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot load article"));
      return null;
    } finally {
      setArticleLoading(false);
    }
  };

  const handleVoteArticleHelpful = async (slug, vote) => {
    setArticleLoading(true);
    try {
      const data = await voteArticleHelpful(slug, vote);
      setArticle(data.data);
      syncArticleInList(data.data);
      toast.success("Thank you for your feedback!");
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot submit your vote"));
      return null;
    } finally {
      setArticleLoading(false);
    }
  };

  return {
    articleLoading,
    articles,
    article,
    handleGetArticles,
    handleSearchArticles,
    handleGetArticleBySlug,
    handleVoteArticleHelpful,
  };
};

export default useArticle;