(() => {
  if (sessionStorage.getItem('fs_gate_passed') !== '1') {
    window.location.replace('gate.html');
  }
})();
