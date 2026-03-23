FROM ruby:3.3.6-slim

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev libvips-dev

WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install
COPY . .

ENTRYPOINT ["bin/build"]
