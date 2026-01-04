import { motion } from 'framer-motion';

const pageVariants = {
  initial: { 
    opacity: 0, 
    filter: 'blur(10px)',
    scale: 0.98 
  },
  animate: { 
    opacity: 1, 
    filter: 'blur(0px)',
    scale: 1 
  },
  exit: { 
    opacity: 0, 
    filter: 'blur(10px)',
    scale: 1.02 
  }
};

const PageTransition = ({ children }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{ width: '100%', height: '100%' }} // Ensures layout stability
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;