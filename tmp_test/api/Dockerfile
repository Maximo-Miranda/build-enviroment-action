FROM golang:1.19-buster AS build

WORKDIR /app

COPY . ./
RUN go mod download

RUN go build -o /test

## Deploy
FROM gcr.io/distroless/base-debian10

WORKDIR /

COPY --from=build /test /test

EXPOSE 8080

USER nonroot:nonroot

ENTRYPOINT ["/test"]