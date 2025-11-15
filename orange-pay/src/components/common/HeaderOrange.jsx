const HeaderOrange = ({ onBack, children }) => (
  <Center>
    <div className="relative w-full h-dvh max-w-[393px] max-h-[852px] rounded-[28px] overflow-hidden flex flex-col">
      <header className="bg-[#FF9A25] h-28 px-4 pt-[env(safe-area-inset-top)] flex items-start">
        <BackButton />
      </header>
      <section className="flex-1 bg-white rounded-t-3xl px-6 pb-[env(safe-area-inset-bottom)]">
        {children}
      </section>
    </div>
  </Center>
);
