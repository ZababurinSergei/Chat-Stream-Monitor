class CheckResult {
  ok;

  error = {
    type: '',
    details: ''
  };

  constructor(ok, type = '', details = '') {
    this.ok = ok;
    this.error = {
      type,
      details,
    };
  }
}

export default CheckResult;
