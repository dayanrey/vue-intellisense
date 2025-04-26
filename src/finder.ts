import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';

export interface Component {
  name: string;
  source: string;
}

export function find(filePath: string): Component[] {
  let folderPath = path.dirname(filePath);
  let rootPath: string | undefined;

  while (folderPath !== path.parse(folderPath).root) {
    const modulesFolderPath = path.join(folderPath, 'node_modules');

    if (fs.existsSync(modulesFolderPath) && fs.lstatSync(modulesFolderPath).isDirectory()) {
      rootPath = folderPath;

      break;
    }

    folderPath = path.dirname(folderPath);
  }

  if (!rootPath) {
    return [];
  }

  const childPaths = fg.sync('**/*.vue', {
    cwd: path.resolve(rootPath, 'src'),
    absolute: false,
    ignore: ['**/App.vue'],
  });

  return childPaths.map((childPath) => ({
    name: path.basename(childPath, '.vue'),
    source: path.posix.join('@', childPath),
  }));
}
