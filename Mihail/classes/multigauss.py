from scipy.stats import multivariate_normal
import numpy as np


class MultiGauss:
    def __init__(self, data: np.ndarray) -> None:
        mean, cov = data.mean(axis=0), data.var(axis=0)
        self.distribution = multivariate_normal(mean, cov)
        self.pdf_mean = self.distribution.pdf(mean)

    def pdf_vs_mean(self, target):
        return self.distribution.pdf(target) / self.pdf_mean
