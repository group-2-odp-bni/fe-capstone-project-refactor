// src/pages/ProfilePage.jsx
import React from "react";
import { ProfileProvider, useProfile } from "../context/ProfileContext";
import ProfileCard from "../components/account/ProfileCard";
// import AccountDetails from "../components/account/AccountDetails";
// import EditAccountForm from "../components/account/EditAccountForm";

function ProfileContent() {
  const { view } = useProfile();

  // choose component by context view
  if (view === "details") return <AccountDetails />;
  if (view === "edit") return <EditAccountForm />;

  // default = profile card
  return <ProfileCard />;
}

// export page wrapped with provider (so you can mount this single page)
export default function ProfilePage() {
  return (
    <ProfileProvider>
      <ProfileContent />
    </ProfileProvider>
  );
}
