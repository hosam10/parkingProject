import React, { useState } from 'react';
import Modal from '../Modal/Modal';
import './Header.css';

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  // const handleHome = () =>{
  //   navigate('/home');
  // }
  return (
    <div className='header'>
      {/* <button className='how-it-works-btn' onClick={handleHome}>
        Home
      </button> */}
      <button className='how-it-works-btn' onClick={openModal}>
        How it works
      </button>
      <Modal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default Header;
