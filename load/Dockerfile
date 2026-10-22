# Teste de carga (k6). Contexto do build: esta pasta
FROM grafana/k6:2.3.0

WORKDIR /home/k6
RUN mkdir test-results
COPY votacao.js .
# Além do JUnit e do JSON do handleSummary, o k6 exporta o relatório HTML (web dashboard) no fim
ENV K6_WEB_DASHBOARD=true \
    K6_WEB_DASHBOARD_EXPORT=test-results/relatorio.html

CMD ["run", "votacao.js"]
