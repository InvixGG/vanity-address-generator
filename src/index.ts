import main from "./app.ts";

main()
    .then(() => {
        console.log('Main function completed successfully.');
    })
    .catch((error) => {
        console.error('An error occurred:', error);
        process.exit(1);
    });