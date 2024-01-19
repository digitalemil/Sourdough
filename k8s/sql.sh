
alias k="kubectl --insecure-skip-tls-verify"

k exec -n cockroachdb -it cockroachdb-client-secure -- ./cockroach sql --certs-dir=/cockroach/cockroach-certs --host=cockroachdb-public -d flowersdb
