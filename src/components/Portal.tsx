import React from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ children }) => {
  // We use document.body to ensure the modal is rendered outside any restricted stacking context.
  return createPortal(children, document.body);
};

export default Portal;
