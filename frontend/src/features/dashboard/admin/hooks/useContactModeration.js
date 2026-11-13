import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { getAllContacts, getContactById, replyToContact, deleteContact } from "../services/contactModerationAPI";

const useContactModeration = () => {
  const [contacts, setContacts] = useState([]);
  const [contactDetail, setContactDetail] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(false);

  const handleGetAllContacts = async () => {
    setContactsLoading(true);
    try {
      const res = await getAllContacts();
      setContacts(res.data);
      return true;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot load contacts"),
      );
      return false;
    } finally {
      setContactsLoading(false);
    }
  };

  const handleGetContactById = async (id) => {
    setContactsLoading(true);
    try {
      const res = await getContactById(id);
      setContactDetail(res.data);
      return true;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot load contact"),
      );
      return false;
    } finally {
      setContactsLoading(false);
    }
  };

  const handleReplyToContact = async (id, payload) => {
    setContactsLoading(true);
    try {
      await replyToContact(id, payload);
      toast.success("Reply sent successfully");
      return true;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot send reply"),
      );
      return false;
    } finally {
      setContactsLoading(false);
    }
  };

  const handleDeleteContact = async (id) => {
    setContactsLoading(true);
    try {
      await deleteContact(id);
      toast.success("Contact message deleted");
      return true;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot delete contact"),
      );
      return false;
    } finally {
      setContactsLoading(false);
    }
  };

  return {
    contacts,
    contactDetail,
    contactsLoading,
    handleGetAllContacts,
    handleGetContactById,
    handleReplyToContact,
    handleDeleteContact,
  };
};

export default useContactModeration;
