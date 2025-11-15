import React from "react";
import ContactListItem from "../ui/ContactListItem";

function ContactListMemo({ contacts, getKey, pick }) {
  return (
    <>
      {contacts.map((c, idx) => (
        <ContactListItem 
          key={getKey(c, idx)} 
          contact={c} 
          onPick={pick} 
        />
      ))}
    </>
  );
}

export default React.memo(ContactListMemo);
