# csv-browser

Run with:
First:
```
npm install
````
then for dev worksss:
```
npm run dev
```
or for prod:
```
Yea not gonne lie, I dont have that rn. 
```

## Docker Deployment

To deploy the application using Docker, follow these steps:

1. **Build the Docker image:**
   ```bash
   docker build -t csv-browser .
   ```

2. **Run the Docker container:**
   ```bash
   docker run -p 3000:3000 csv-browser
   ```

Alternatively, you can use Docker Compose:

1. **Start the application:**
   ```bash
   docker-compose up
   ```

2. **Stop the application:**
   ```bash
   docker-compose down
   ```