import { motion as Motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0 },
};

const fadeRight = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0 },
};

const PRESETS = {
  up: fadeUp,
  fade: fadeIn,
  left: fadeLeft,
  right: fadeRight,
};

/**
 * One-time scroll/enter reveal. Plays once per mount (page load or refresh).
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
  duration = 0.55,
  variant = 'up',
  amount = 0.2,
  as = 'div',
}) {
  const MotionTag = Motion[as] || Motion.div;
  const variants = PRESETS[variant] || fadeUp;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      transition={{ duration, ease: EASE, delay }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}

/** Parent that staggers child RevealItems once when scrolled into view. */
export function RevealStagger({
  children,
  className = '',
  stagger = 0.08,
  amount = 0.15,
  as = 'div',
}) {
  const MotionTag = Motion[as] || Motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: 0.04 },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}

export function RevealItem({ children, className = '', as = 'div' }) {
  const MotionTag = Motion[as] || Motion.div;

  return (
    <MotionTag
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: EASE },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}
