import React from 'react';
import styles from './Loader.module.css';

const Loader = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-slate-950">
      <div className={styles.loader} />
    </div>
  );
};

export default Loader;