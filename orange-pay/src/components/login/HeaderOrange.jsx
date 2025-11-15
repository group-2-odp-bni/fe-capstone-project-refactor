import BackButton from "../common/BackButton";

export default function HeaderOrange({ onBack }) {
  return (
    <header className="relative h-28 flex items-start justify-start px-4 pt-[env(safe-area-inset-top)]">
      {onBack && <BackButton />}
    </header>
  );
}
