import { useEffect } from 'react';

export function useSidebarScroll(sidebarRef) {
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    let isNavigationLocked = false;
    let lockTimeout = null;

    const setShrunk = (shrunk) => {
      if (!sidebarRef.current) return;
      if (shrunk) {
        sidebarRef.current.classList.add('sidebar--shrunk');
      } else {
        sidebarRef.current.classList.remove('sidebar--shrunk');
      }
    };

    const handleScroll = () => {
      if (window.innerWidth > 768) return;
      if (isNavigationLocked) return;

      const currentY = window.scrollY;

      if (currentY <= 0) {
        setShrunk(false);
        lastScrollY = currentY;
        return;
      }

      if (Math.abs(currentY - lastScrollY) > 10) {
        const goingDown = currentY > lastScrollY;
        
        if (goingDown && currentY > 60) {
          setShrunk(true); 
        } else if (!goingDown) {
          setShrunk(false); 
        }
        lastScrollY = currentY;
      }
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleNavStart = () => {
      isNavigationLocked = true;
      setShrunk(false);
      if (lockTimeout) clearTimeout(lockTimeout);
    };

    const handleNavEnd = () => {
      lockTimeout = setTimeout(() => {
        isNavigationLocked = false;
        lastScrollY = window.scrollY; 
      }, 300);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('navigation-start', handleNavStart);
    window.addEventListener('navigation-end', handleNavEnd);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('navigation-start', handleNavStart);
      window.removeEventListener('navigation-end', handleNavEnd);
      if (lockTimeout) clearTimeout(lockTimeout);
    };
  }, [sidebarRef]);
}
