# documents on repository

This app want to help developer using multiple formats to write and manage documents in a git-managed repository
It is helpful to prevent inconsistencies between code and documentation and give AI tooling more hint.

[document](doc/index.md)

## Key Feature

- Render
  - [x] create index page automatically
  - [x] render markdown (by [markdown-it](https://github.com/markdown-it/markdown-it))
  - [x] render ppt (by [reveal.js](https://revealjs.com/))

## Usage

To run the application, use the following command:

```bash
npm start
```

```bash
Usage: index [options]

Options:
  -p, --port <number>  port number (default: "3000")
  --root <folder>      document folder (default: "doc")
  -h, --help           display help for command
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
