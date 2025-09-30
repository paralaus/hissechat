import {useMatches} from 'react-router-dom';
import {Breadcrumb, BreadcrumbItem} from '@chakra-ui/react';

function Breadcrumbs() {
  let matches = useMatches();
  let crumbs = matches
    // first get rid of any matches that don't have handle and crumb
    .filter(match => Boolean(match.handle?.crumb))
    // now map them into an array of elements, passing the loader
    // data to each one
    .map(match => match.handle.crumb(match.data));

  return (
    <Breadcrumb
      display={{base: 'none', md: 'flex'}}
      mr={'auto'}
      fontWeight={'medium'}
      fontSize="medium"
      color={'gray.800'}>
      {crumbs.map((crumb, index) => (
        <BreadcrumbItem key={index}>{crumb}</BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}

export default Breadcrumbs;
