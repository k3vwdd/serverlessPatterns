# Lambda Functions Structure

Each Lambda function should be in its own directory:

```
src/
  └── sample-function/
      └── index.ts
```

After compilation, the structure in dist/ will match this layout.
Each function should be in its own directory to support individual deployment.
