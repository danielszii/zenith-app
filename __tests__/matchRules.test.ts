import { formatClock, retryDelay, shouldAutoExpel } from '../src/domain/matchRules';

describe('regras da súmula', () => {
  it('formata o cronómetro', () => expect(formatClock(125)).toBe('02:05'));
  it('expulsa automaticamente no segundo amarelo', () => {
    expect(shouldAutoExpel(1)).toBe(false);
    expect(shouldAutoExpel(2)).toBe(true);
  });
  it('limita o retry a cinco minutos', () => {
    expect(retryDelay(1)).toBe(4000);
    expect(retryDelay(20)).toBe(300000);
  });
});
