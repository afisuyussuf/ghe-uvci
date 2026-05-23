import Swal from 'sweetalert2';

export const getThemedSwal = () => {
  const isDark = document.documentElement.classList.contains('dark');
  return Swal.mixin({
    background: isDark ? '#0f172a' : '#fff',
    color: isDark ? '#fff' : '#1e293b',
    confirmButtonColor: '#5A2D82',
    cancelButtonColor: '#64748b',
    cancelButtonText: 'Annuler',
    customClass: {
      popup: 'rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl',
    }
  });
};

export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  const isDark = document.documentElement.classList.contains('dark');
  Swal.fire({
    title,
    icon,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: isDark ? '#1e293b' : '#fff',
    color: isDark ? '#fff' : '#1e293b',
  });
};
