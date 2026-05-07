FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app
COPY . .
RUN dotnet publish Kapacitet.API -c Release -o out

FROM build AS bundle
RUN dotnet tool install --global dotnet-ef --version 9.0.* && \
    /root/.dotnet/tools/dotnet-ef migrations bundle \
      --project Kapacitet.Infrastructure \
      --startup-project Kapacitet.API \
      --output /app/efbundle \
      --self-contained \
      --runtime linux-x64

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS app
WORKDIR /app
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "Kapacitet.API.dll"]

FROM mcr.microsoft.com/dotnet/runtime-deps:9.0 AS migrator
WORKDIR /app
COPY --from=bundle /app/efbundle ./efbundle
ENTRYPOINT ["./efbundle"]
