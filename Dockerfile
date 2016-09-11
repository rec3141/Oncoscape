# Build Run
# docker run -d --name kong-database -p 5432:5432 -e "POSTGRES_USER=kong" -e "POSTGRES_DB=kong" postgres:9.4
# docker build -t kong/oncoscape .
# docker run -t -i -p 80 --name web kong/oncoscape bash
# /usr/bin/supervisord -n -c /etc/supervisord/supervisord-kong.conf &

# Use Ubuntu 14.04 as the base container
FROM ubuntu:14.04

# Add the package verification key
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9
RUN apt-get -y -qq update && apt-get -y -qq install \
	netcat \
	openssl \
	apache2 \
	apache2-utils \
	libpcre3 \
	dnsmasq \
	procps \
	apt-transport-https \
	make \
	gcc \
	g++ \
	libxml2 \
	libxml2-dev \
	python-pip \
	curl \
	nano \
	supervisor

# Install OpenCPU
RUN \
	apt-get update && \
	apt-get -y dist-upgrade && \
	apt-get install -y software-properties-common && \
	add-apt-repository -y ppa:opencpu/opencpu-1.6 && \
	apt-get update && \
	apt-get install -y opencpu 
RUN truncate -s 0 /etc/apache2/ports.conf

# Install Kong
RUN curl -sL https://github.com/Mashape/kong/releases/download/0.9.0/kong-0.9.0.trusty_all.deb > kong-0.9.0.trusty_all.deb  && \
	dpkg -i kong-0.9.0.trusty_all.deb
ENV KONG_DATABASE=postgres KONG_PG_HOST=140.107.117.18 KONG_PG_PORT=32023 KONG_PG_USER=GBdh62FfCvwtnqey KONG_PG_PASSWORD=hUDrQe7m5fXKprJC KONG_PG_DATABASE=OncoGateway KONG_ADMIN_LISTEN=127.0.0.1:8001
ADD /kong.conf /etc/kong/

# Install Node 6.x + PM2
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get -y -qq install nodejs
RUN npm install -g pm2

# Add NGinx Config 
ADD  /nginx-kong-oncoscape.template /usr/local/kong/

# Create Application User + Add Custom Code
RUN useradd -u 7534 -m -d /home/sttrweb -c "sttr web application" sttrweb && \
	mkdir /home/sttrweb/Oncoscape
ADD client-build /home/sttrweb/Oncoscape/client
ADD node /home/sttrweb/Oncoscape/server
WORKDIR /home/sttrweb/Oncoscape/server
RUN npm install


# Entry Point Used To Create HTPassword + Replace Tokens In Config Files
#ADD entrypoint.sh /home/sttrweb/Oncoscape/entrypoint.sh
#ENTRYPOINT ["/home/sttrweb/Oncoscape/entrypoint.sh"]

# Expose Ports
EXPOSE 80 8000 8001 8003 8004

# Config + Start Supervisor
RUN mkdir /etc/supervisord
ADD  /supervisord-kong.conf /etc/supervisord/
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisord/supervisord-kong.conf"]