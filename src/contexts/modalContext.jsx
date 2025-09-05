import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);

  const openFacultyModal = () => setIsFacultyModalOpen(true);
  const closeFacultyModal = () => setIsFacultyModalOpen(false);

  return (
    <ModalContext.Provider value={{ isFacultyModalOpen, openFacultyModal, closeFacultyModal }}>
      {children}
    </ModalContext.Provider>
  );
};
