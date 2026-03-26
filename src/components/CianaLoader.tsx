import { motion } from "framer-motion";
import cianaLogo from "@/assets/ciana-logo.png";

interface CianaLoaderProps {
  fullScreen?: boolean;
  text?: string;
}

const CianaLoader = ({ fullScreen = false, text }: CianaLoaderProps) => {
  if (fullScreen) {
    return (
      <motion.div
        key="ciana-loader"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="c-spinner">
            <img src={cianaLogo} alt="Ciana" className="c-spinner-logo" />
          </div>
          {text && <p className="text-sm text-muted-foreground font-medium">{text}</p>}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="c-spinner">
        <img src={cianaLogo} alt="Ciana" className="c-spinner-logo" />
      </div>
      {text && <p className="text-sm text-muted-foreground font-medium">{text}</p>}
    </motion.div>
  );
};

export default CianaLoader;
